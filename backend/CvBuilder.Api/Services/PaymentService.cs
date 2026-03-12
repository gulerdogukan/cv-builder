using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Models;
using Microsoft.EntityFrameworkCore;
using Iyzipay;
using Iyzipay.Model;
using Iyzipay.Request;

namespace CvBuilder.Api.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;

    // Plan fiyatları (TRY kuruş cinsinden — İyzico ondalıklı string ister)
    private const string ONE_TIME_PRICE = "99.0";
    private const string MONTHLY_PRICE  = "49.0";
    private const string CURRENCY = "TRY";

    public PaymentService(AppDbContext db, IConfiguration config, ILogger<PaymentService> logger)
    {
        _db     = db;
        _config = config;
        _logger = logger;
    }

    // ── İyzico Options ────────────────────────────────────────────────────────
    private Options IyzicoOptions() => new Options
    {
        ApiKey    = _config["Iyzico:ApiKey"]    ?? "",
        SecretKey = _config["Iyzico:SecretKey"] ?? "",
        BaseUrl   = _config["Iyzico:BaseUrl"]   ?? "https://sandbox-api.iyzipay.com",
    };

    // ── 1. Checkout Form Başlat ───────────────────────────────────────────────
    public async Task<InitiatePaymentResponse> InitiateCheckoutAsync(
        Guid userId, InitiatePaymentRequest request, string callbackUrl)
    {
        var isOneTime = request.PlanType == "one_time";
        var price     = isOneTime ? ONE_TIME_PRICE : MONTHLY_PRICE;
        var planName  = isOneTime ? "CV Builder Tek Seferlik" : "CV Builder Aylık";

        // DB'de pending ödeme kaydı oluştur
        var payment = new Payment
        {
            Id         = Guid.NewGuid(),
            UserId     = userId,
            Amount     = decimal.Parse(price),
            Currency   = CURRENCY,
            Status     = PaymentStatus.Pending,
            PlanType   = isOneTime ? PaymentPlanType.OneTime : PaymentPlanType.Monthly,
            CreatedAt  = DateTime.UtcNow,
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // İyzico Create Checkout Form Request
        var checkoutRequest = new CreateCheckoutFormInitializeRequest
        {
            Locale          = Locale.TR.ToString(),
            ConversationId  = payment.Id.ToString(),
            Price           = price,
            PaidPrice       = price,
            Currency        = CURRENCY,
            BasketId        = payment.Id.ToString(),
            PaymentGroup    = PaymentGroup.PRODUCT.ToString(),
            CallbackUrl     = callbackUrl,
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
                IdentityNumber      = "74300864791",   // sandbox zorunlu alan
                LastLoginDate       = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                RegistrationDate    = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                RegistrationAddress = "Turkiye",
                Ip                  = "85.34.78.112",   // sandbox
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
                    Id         = payment.Id.ToString(),
                    Name       = planName,
                    Category1  = "Yazılım",
                    ItemType   = BasketItemType.VIRTUAL.ToString(),
                    Price      = price,
                },
            },
        };

        var form = await Task.Run(() =>
            CheckoutFormInitialize.Create(checkoutRequest, IyzicoOptions()));

        _logger.LogInformation("İyzico checkout form: Status={Status}, Token={Token}",
            form.Status, form.Token);

        if (form.Status != "success")
        {
            _logger.LogError("İyzico form oluşturulamadı: {ErrorMessage}", form.ErrorMessage);
            throw new InvalidOperationException($"Ödeme başlatılamadı: {form.ErrorMessage}");
        }

        // Token'ı payment kaydına yaz
        payment.IyzicoToken = form.Token;
        await _db.SaveChangesAsync();

        return new InitiatePaymentResponse(
            Token: form.Token,
            CheckoutFormContent: form.CheckoutFormContent ?? ""
        );
    }

    // ── 2. Callback İşle ─────────────────────────────────────────────────────
    public async Task<(bool Success, string Message)> ProcessCallbackAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return (false, "Token boş");

        // Ödeme sonucunu İyzico'dan doğrula
        var retrieveRequest = new RetrieveCheckoutFormRequest
        {
            Locale         = Locale.TR.ToString(),
            Token          = token,
        };

        var result = await Task.Run(() =>
            CheckoutForm.Retrieve(retrieveRequest, IyzicoOptions()));

        _logger.LogInformation("İyzico callback: Status={Status}, PaymentStatus={PaymentStatus}, Token={Token}",
            result.Status, result.PaymentStatus, token);

        // DB'den token ile ödeme kaydını bul
        var payment = await _db.Payments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.IyzicoToken == token);

        if (payment == null)
        {
            _logger.LogWarning("Bilinmeyen token callback: {Token}", token);
            return (false, "Ödeme kaydı bulunamadı");
        }

        if (result.Status == "success" && result.PaymentStatus == "SUCCESS")
        {
            payment.Status = PaymentStatus.Success;
            payment.User.Plan = PlanType.Paid;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Ödeme başarılı — UserId={UserId}, PlanType={Plan}",
                payment.UserId, payment.PlanType);
            return (true, "Ödeme başarılı");
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            await _db.SaveChangesAsync();

            var errMsg = result.ErrorMessage ?? result.PaymentStatus ?? "Bilinmeyen hata";
            return (false, $"Ödeme başarısız: {errMsg}");
        }
    }

    // ── 3. Plan Durumu ────────────────────────────────────────────────────────
    public async Task<PaymentStatusResponse> GetPaymentStatusAsync(Guid userId)
    {
        var user = await _db.Users
            .Include(u => u.Payments)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new PaymentStatusResponse("free");

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
