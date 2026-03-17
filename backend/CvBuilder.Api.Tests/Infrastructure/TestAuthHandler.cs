using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace CvBuilder.Api.Tests.Infrastructure;

/// <summary>
/// Test authentication handler — replaces Supabase JWT validation in integration tests.
/// Reads X-Test-UserId header and creates a ClaimsPrincipal with sub = that GUID.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "Test";
    public const string UserIdHeader = "X-Test-UserId";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(UserIdHeader, out var userIdValues))
            return Task.FromResult(AuthenticateResult.Fail("Missing X-Test-UserId header"));

        var userId = userIdValues.FirstOrDefault();
        if (!Guid.TryParse(userId, out _))
            return Task.FromResult(AuthenticateResult.Fail("Invalid GUID in X-Test-UserId header"));

        var claims = new[]
        {
            new Claim("sub", userId!),
            new Claim("email", $"test-{userId}@example.com"),
            new Claim("aud", "authenticated"),
            new Claim("role", "authenticated"),
        };

        var identity  = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket    = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
