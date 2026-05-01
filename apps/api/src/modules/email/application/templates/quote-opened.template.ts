import { baseEmailTemplate } from './base.template';

export function quoteOpenedTemplate(brokerName: string, clientName: string, quoteUrl: string): string {
  const firstName = brokerName.split(' ')[0];

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">
      Cotação visualizada!
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      Olá, ${firstName}. <strong>${clientName}</strong> acabou de abrir a cotação que você compartilhou.
      Este é um ótimo momento para entrar em contato!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <a href="${quoteUrl}"
             style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;
                    font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;
                    letter-spacing:-0.2px;">
            Ver cotação
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px;" />

    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      Você receberá esta notificação apenas na primeira vez que o link for aberto.
    </p>
  `;

  return baseEmailTemplate(content);
}
