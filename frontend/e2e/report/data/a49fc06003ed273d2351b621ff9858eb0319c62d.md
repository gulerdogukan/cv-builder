# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - link "CV CV Builder" [ref=e6] [cursor=pointer]:
      - /url: /
      - generic [ref=e8]: CV
      - generic [ref=e9]: CV Builder
    - paragraph [ref=e10]: Hesabınıza giriş yapın
  - button "Google ile Giriş Yap" [ref=e11] [cursor=pointer]:
    - img [ref=e12]
    - text: Google ile Giriş Yap
  - generic [ref=e19]: veya e-posta ile
  - generic [ref=e21]:
    - generic [ref=e22]:
      - generic [ref=e23]: E-posta
      - textbox "E-posta" [ref=e24]:
        - /placeholder: ornek@email.com
        - text: test@example.com
    - generic [ref=e25]:
      - generic [ref=e27]: Şifre
      - textbox "Şifre" [active] [ref=e28]:
        - /placeholder: Şifrenizi girin
        - text: wrongpassword
    - button "Giriş Yap" [ref=e29] [cursor=pointer]
  - paragraph [ref=e30]:
    - text: Hesabınız yok mu?
    - link "Kayıt Ol" [ref=e31] [cursor=pointer]:
      - /url: /register
```