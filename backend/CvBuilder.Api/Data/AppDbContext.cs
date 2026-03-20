using CvBuilder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<CV> CVs => Set<CV>();
    public DbSet<CVSection> CVSections => Set<CVSection>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Plan)
                .HasConversion<string>()
                .HasMaxLength(20);
        });

        // CV
        modelBuilder.Entity<CV>(entity =>
        {
            entity.HasOne(c => c.User)
                .WithMany(u => u.CVs)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => c.UserId);

            // PostgreSQL optimistic concurrency: xmin sistem kolonu.
            // xid tipi PostgreSQL'de uint32'ye karşılık gelir — C# tarafı da uint olmalı.
            // byte[] + [Timestamp] SQL Server rowversion içindir; Npgsql ile type mismatch fırlatır.
            entity.Property(c => c.RowVersion)
                .HasColumnName("xmin")
                .HasColumnType("xid")
                .ValueGeneratedOnAddOrUpdate()
                .IsConcurrencyToken();
        });

        // CVSection
        modelBuilder.Entity<CVSection>(entity =>
        {
            entity.HasOne(s => s.CV)
                .WithMany(c => c.Sections)
                .HasForeignKey(s => s.CvId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(s => s.SectionType)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasIndex(s => s.CvId);
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasOne(p => p.User)
                .WithMany(u => u.Payments)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(p => p.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(p => p.PlanType)
                .HasConversion<string>()
                .HasMaxLength(20);

            // İyzico callback lookup için partial index — callback O(1) olsun
            entity.HasIndex(p => p.IyzicoToken)
                .HasFilter("\"IyzicoToken\" IS NOT NULL")
                .HasDatabaseName("IX_Payments_IyzicoToken");
        });
    }
}
