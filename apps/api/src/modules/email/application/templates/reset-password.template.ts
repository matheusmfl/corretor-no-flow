import { baseEmailTemplate } from './base.template';

export function resetPasswordTemplate(name: string, resetUrl: string): string {
  const firstName = name.split(' ')[0];

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">
      Redefinir senha
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      Olá, ${firstName}. Recebemos um pedido para redefinir a senha da sua conta.
      Clique no botão abaixo para criar uma nova senha.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <a href="${resetUrl}"
             style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;
                    font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;
                    letter-spacing:-0.2px;">
            Redefinir senha
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.6;">
      Ou copie e cole este link no navegador:
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:#a1a1aa;word-break:break-all;">
      ${resetUrl}
    </p>

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px;" />

    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      Este link é válido por <strong>1 hora</strong> e pode ser usado apenas uma vez.
      Se você não solicitou a redefinição de senha, ignore este e-mail.
    </p>
  `;

  return baseEmailTemplate(content);
}
