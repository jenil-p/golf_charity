import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWinnerAlertEmail = async (userEmail, userName, prizeAmount, matchTier) => {
    try {
        await resend.emails.send({
            from: 'ImpactLinks <winners@impactlinks.com>',
            to: userEmail,
            subject: `COngrats! ou Won ₹${prizeAmount} in the ImpactLinks Draw!`,
            html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0A3622;">Congratulations, ${userName}!</h1>
            <p>Your recent Stableford scores hit a <strong>${matchTier}-Number Match</strong> in this month's algorithmic draw.</p>
            <div style="background-color: #FFDE59; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; color: #0A3622;">Prize Amount: ₹${prizeAmount.toLocaleString()}</h2>
            </div>
            <p><strong>Next Step:</strong> Please log into your dashboard and upload a screenshot of your official golf club scorecard to verify your scores and claim your payout.</p>
            <a href="https://yourwebsite.com/dashboard" style="display: inline-block; background-color: #0A3622; color: #FFDE59; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Claim Winnings</a>
        </div>
      `,
        });
        console.log(`Email sent to ${userEmail}`);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
};