# Templates de Email — e-PetPlace

## Dónde configurar

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Menú izquierdo → **Authentication** → **Email Templates**
3. Selecciona **Reset Password**
4. Reemplaza el Subject y el Body con los valores de abajo
5. Haz clic en **Save**

---

## Reset Password

**Subject:**
```
Recupera tu contraseña — e-PetPlace 🐾
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recupera tu contraseña</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo / marca -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#FF2D9B,#00E5FF,#FFE600);border-radius:16px;padding:3px;">
                <div style="background:#000;border-radius:14px;padding:14px 24px;">
                  <span style="font-size:28px;font-weight:900;background:linear-gradient(90deg,#FF2D9B,#00E5FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">e-PetPlace</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Tarjeta principal -->
          <tr>
            <td style="background:#111111;border-radius:20px;border:1px solid #222222;padding:40px 32px;">

              <!-- Ícono -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#FF2D9B,#00E5FF);display:inline-flex;align-items:center;justify-content:center;font-size:32px;line-height:72px;text-align:center;">
                      🔐
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Título -->
              <p style="color:#ffffff;font-size:22px;font-weight:800;text-align:center;margin:0 0 10px;">
                Restablecer contraseña
              </p>

              <!-- Subtítulo -->
              <p style="color:#666666;font-size:14px;text-align:center;margin:0 0 32px;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en e-PetPlace.
                Haz clic en el botón de abajo para elegir una nueva contraseña.
              </p>

              <!-- Botón CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                      style="display:inline-block;padding:16px 40px;border-radius:14px;background:linear-gradient(90deg,#FF2D9B,#00E5FF);color:#000000;font-size:16px;font-weight:700;text-decoration:none;box-shadow:0 0 30px rgba(0,229,255,0.3);">
                      Restablecer contraseña →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso expiración -->
              <div style="background:rgba(255,230,0,0.08);border:1px solid rgba(255,230,0,0.2);border-radius:12px;padding:14px 16px;margin-bottom:24px;">
                <p style="color:#FFE600;font-size:13px;margin:0;text-align:center;">
                  ⏱ Este link expira en <strong>60 minutos</strong>
                </p>
              </div>

              <!-- Link alternativo -->
              <p style="color:#444444;font-size:12px;text-align:center;margin:0 0 8px;">
                Si el botón no funciona, copia y pega este link en tu navegador:
              </p>
              <p style="word-break:break-all;font-size:11px;color:#555555;text-align:center;margin:0;">
                <a href="{{ .ConfirmationURL }}" style="color:#00E5FF;text-decoration:none;">
                  {{ .ConfirmationURL }}
                </a>
              </p>

            </td>
          </tr>

          <!-- Nota de seguridad -->
          <tr>
            <td style="padding:24px 0 0;">
              <p style="color:#333333;font-size:12px;text-align:center;margin:0;line-height:1.6;">
                Si no solicitaste este cambio, puedes ignorar este email.<br/>
                Tu contraseña actual seguirá siendo la misma.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <div style="display:inline-flex;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#FF2D9B;display:inline-block;box-shadow:0 0 8px #FF2D9B;"></span>
                <span style="width:8px;height:8px;border-radius:50%;background:#00E5FF;display:inline-block;box-shadow:0 0 8px #00E5FF;"></span>
                <span style="width:8px;height:8px;border-radius:50%;background:#FFE600;display:inline-block;box-shadow:0 0 8px #FFE600;"></span>
              </div>
              <p style="color:#333333;font-size:11px;margin:10px 0 0;">
                © e-PetPlace · Tu mundo animal, digitalizado
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Confirm Signup (opcional — mismo estilo)

**Subject:**
```
Confirma tu cuenta — e-PetPlace 🐾
```

Misma estructura de arriba, cambia:
- El ícono de 🔐 a 🐾
- El título a `¡Bienvenido/a a e-PetPlace!`
- El texto a `Confirma tu email para activar tu cuenta y empezar a gestionar a tus mascotas.`
- El botón a `Activar mi cuenta →`

---

## Notas

- `{{ .ConfirmationURL }}` es la variable de Supabase que se reemplaza con el link real.
- El gradiente del botón usa los colores de marca: `#FF2D9B` → `#00E5FF`.
- Probado en Gmail, Apple Mail y Outlook.
