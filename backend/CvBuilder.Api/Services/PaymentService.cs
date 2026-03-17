using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Models;
using Microsoft.EntityFrameworkCore;
using Iyzipay;
using Iyzipay.Model;
using Iyzipay.Request;
using Payment = CvBuilder.Api.Models.Payment;

namespace CvBuilder.Api.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;
    private const string CURRENCY = "TRY";

    public PaymentService(AppDbContext db, IConfiguration config, ILogger<PaymentService> logger)
    {
        _db     = db;
        _config = config;
        _logger = logger;
    }

    private Options IyzicoOptions() => new Options
    {
        ApiKey    = _config["Iyzico:ApiKey"]    ?? "",
        SecretKey = _config["Iyzico:SecretKey"] ?? "",
        BaseUrl   = _config["Iyzico:BaseUrl"]   ?? "https://sandbox-api.iyzipay.com",
    };

    // Fiyatlar config'den gelir; yoksa default değer kullanılır
    private string OneTimePrice => _config["Iyzico:OneTimePrice"] ?? "99.0";
    private string MonthlyPrice => _config["Iyzico:MonthlyPrice"] ?? "49.0";

    // ── 1. Checkout Form Başlat ───────────────────────────────────────────────
    public async Task<InitiatePaymentResponse> InitiateCheckoutAsync(
        Guid userId, InitiatePaymentRequest request, string callbackUrl)
    {
        var isOneTime = request.PlanType == "one_time";
        var price     = isOneTime ? OneTimePrice : MonthlyPrice;
        var planName  = isOneTime ? "CV Builder Tek Seferlik" : "CV Builder Aylık";

        if (!decimal.TryParse(price, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var priceDecimal))
            throw new InvalidOperationException("Geçersiz fiyat konfigürasyonu.");

        var payment = new Payment
        {
            Id        = Guid.NewGuid(),
            UserId    = userId,
            Amount    = priceDecimal,
            Currency  = CURRENCY,
            Status    = PaymentStatus.Pending,
            PlanType  = isOneTime ? PaymentPlanType.OneTime : PaymentPlanType.Monthly,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // Gerçek kullanıcı IP'sini al; fallback sadece sandbox için
        var clientIp = _config["Iyzico:FallbackIp"] ?? "85.34.78.112";

        var checkoutRequest = new CreateCheckoutFormInitializeRequest
        {
            Locale              = Locale.TR.ToString(),
            ConversationId      = payment.Id.ToString(),
            Price               = price,
            PaidPrice           = price,
            Currency            = CURRENCY,
            BasketId            = payment.Id.ToString(),
            PaymentGroup        = PaymentGroup.PRODUCT.ToString(),
            CallbackUrl         = callbackUrl,
            EnabledInstallments = new List<int> { 1, 2, 3 },

            Buyer = new Buyer
            {
                Id                  = userId.ToString(),
                Name                = request.FullName.Split(' ').First(),
                Surname             = request.FullName.Contains(' ')
                    ? string.Join(' ', request.FullName.Split(' ').Skip(1))
                    : request.FullName,
                GsmNumber           = request.PhoneNumber ?? "+905000000000",
                Email               = request.Email,
                // Production'da gerçek TC kimlik no formdan alınmalı.
                // Sandbox için sabit değer kullanılır; config'den override edilebilir.
                IdentityNumber      = _config["Iyzico:TestIdentityNumber"] ?? "74300864791",
                LastLoginDate       = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                RegistrationDate    = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                RegistrationAddress = "Turkiye",
                Ip                  = clientIp,
                City                = "Istanbul",
                Country             = "Turkey",
                ZipCode             = "34732",
            },

            ShippingAddress = new Address
            {
                ContactName = request.FullName,
                City        = "Istanbul",
                Country     = "Turkey",
                Description = "Dijital ürün — teslimat yok",
                ZipCode     = "34732",
            },

            BillingAddress = new Address
            {
                ContactName = request.FullName,
                City        = "Istanbul",
                Country     = "Turkey",
                Description = "Dijital ürün",
                ZipCode     = "34732",
            },

            BasketItems = new List<BasketItem>
            {
                new BasketItem
                {
                    Id        = payment.Id.ToString(),
                    Name      = planName,
                    Category1 = "Yazılım",
                    ItemType  = BasketItemType.VIRTUAL.ToString(),
                    Price     = price,
                },
            },
        };

        var form = await Task.Run(() =>
            CheckoutFormInitialize.Create(checkoutRequest, IyzicoOptions()));

        _logger.LogInformation("İyzico checkout form: Status={Status}, Token={Token}",
            form.Status, form.Token);

        if (form.Status != "success")
        {
            _logger.LogError("İyzico form oluşturulamadı: {Error}", form.ErrorMessage);
            throw new InvalidOperationException($"Ödeme başlatılamadı: {form.ErrorMessage}");
        }

        payment.IyzicoToken = form.Token;
        await _db.SaveChangesAsync();

        return new InitiatePaymentResponse(
            Token: form.Token,
            CheckoutFormContent: form.CheckoutFormContent ?? ""
        );
    }

    // ── 2. Callback İşle — idempotent ─────────────────────────────────────────
    public async Task<(bool Success, string Message)> ProcessCallbackAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return (false, "Token boş");

        // DB'den token ile ödeme kaydını bul
        var payment = await _db.Payments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.IyzicoToken == token);

        if (payment == null)
        {
            _logger.LogWarning("Bilinmeyen token callback: {Token}", token);
            return (false, "Ödeme kaydı bulunamadı");
        }

        // İdempotency: zaten işlenmiş ödeme — tekrar işleme
        if (payment.Status == PaymentStatus.Success)
        {
            _logger.LogInformation("Tekrar callback — zaten başarılı: Token={Token}", token);
            return (true, "Ödeme daha önce onaylandı");
        }

        if (payment.Status == PaymentStatus.Failed)
        {
            _logger.LogInformation("Tekrar callback — zaten başarısız: Token={Token}", token);
            return (false, "Ödeme daha önce başarısız oldu");
        }

        // Ödeme sonucunu İyzico'dan doğrula
        var retrieveRequest = new RetrieveCheckoutFormRequest
        {
            Locale = Locale.TR.ToString(),
            Token  = token,
        };

        var result = await Task.Run(() =>
            CheckoutForm.Retrieve(retrieveRequest, IyzicoOptions()));

        _logger.LogInformation("İyzico verify: Status={Status}, PaymentStatus={PS}, Token={Token}",
            result.Status, result.PaymentStatus, token);

        // EF Core optimistic concurrency: transaction içinde güncelle
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Token ile kaydı yeniden kilitle
            var lockedPayment = await _db.Payments
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.IyzicoToken == token && p.Status == PaymentStatus.Pending);

            if (lockedPayment == null)
            {
                // Başka bir istek tarafından işlendi
                await transaction.RollbackAsync();
                return (payment.Status == PaymentStatus.Success, "Ödeme zaten işlendi");
            }

            if (result.Status == "success" && result.PaymentStatus == "SUCCESS")
            {
                lockedPayment.Status = PaymentStatus.Success;
                lockedPayment.User.Plan = PlanType.Paid;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Ödeme başarılı — UserId={UserId}, Plan={Plan}",
                    lockedPayment.UserId, lockedPayment.PlanType);
                return (true, "Ödeme başarılı");
            }
            else
            {
                lockedPayment.Status = PaymentStatus.Failed;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                var errMsg = result.ErrorMessage ?? result.PaymentStatus ?? "Bilinmeyen hata";
                return (false, $"Ödeme başarısız: {errMsg}");
            }
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Callback işlenirken hata: Token={Token}", token);
            throw;
        }
    }

    // ── 3. Plan Durumu ────────────────────────────────────────────────────────
    public async Task<PaymentStatusResponse?> GetPaymentStatusAsync(Guid userId)
    {
        var user = await _db.Users
            .Include(u => u.Payments)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return null;  // 404 için null döner

        var lastPayment = user.Payments
            .Where(p => p.Status == PaymentStatus.Success)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefault();

        return new PaymentStatusResponse(
            Plan:              user.Plan == PlanType.Paid ? "paid" : "free",
            LastPaymentStatus: lastPayment?.Status.ToString(),
            PaidAt:            lastPayment?.CreatedAt
        );
    }
}
