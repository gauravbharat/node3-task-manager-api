const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => { 
  sgMail.send({
    to: email,
    from: 'support@veerappa.co',
    subject: 'Thanks for joining in!',
    text: `Welcome to the Task Manager app, ${name}. Let me know how you get along with the app.`,
    html: `<h2>Welcome to the Task Manager app, ${name}.</h2> 
    <p>Let me know how you get along with the app.</p>
    <p><strong>Sent using SendGrid service with Node.js</strong></p>`
  });
};

const sendEmailOnCancellation = (email, name) => {
  sgMail.send({
    to: email,
    from: 'support@veerappa.co',
    subject: 'Sorry to see you go!',
    text: `Dear, ${name}. This to confirm that your account has been cancelled. I hope to see you back sometime soon.`,
    html: `<h2>Dear, ${name}.</h2> 
    <p>This to confirm that your account has been cancelled. I hope to see you back sometime soon.</p>
    <p><strong>Sent using SendGrid service with Node.js</strong></p>`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendEmailOnCancellation
}


 
