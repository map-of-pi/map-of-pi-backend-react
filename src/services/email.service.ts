// import nodemailer from 'nodemailer';
// import { env } from '../utils/env';

// /**
//  * Sends an email using the configured SMTP transporter.
//  * 
//  * @param {string} text - The plain text content of the email.
//  * @param {string} subject - The subject of the email.
//  * @param {string} to - The recipient's email address.
//  * @param {string} html - The HTML content of the email.
//  * @returns {Promise<void>} - Resolves when the email is sent successfully.
//  */
// export async function sendEmail(
//   text: string, 
//   subject: string, 
//   to: string, 
//   html: string
// ): Promise<void> {
//   try {
//     // Configure the SMTP transporter
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com', // SMTP host
//       port: 465,             // SMTP port (465 for SSL)
//       secure: false,          // Use SSL
//       auth: {
//         user: env.SMTP_USER, // SMTP username
//         pass: env.SMTP_PASS, // SMTP password
//       },
//       connectionTimeout: 10000,
//       greetingTimeout: 10000,
//       socketTimeout: 10000,
//       debug: true,
//       logger: true,
//     });

//     // Email options
//     const mailOptions = {
//       from: `"Map of Pi" <${env.SMTP_USER}>`, // Sender email
//       to,                                    // Recipient email
//       subject,                               // Email subject
//       text,                                  // Plain text content
//       html,                                  // HTML content
//     };

//     // Send the email
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully:', info.messageId);
//   } catch (error) {
//     console.error('Failed to send email:', error);
//     throw error;
//   }
// }


// await sendEmail(
//   'Item added successfully',
//   'Add New Item for sale',
//   'yusufhammed39@gmail.com',
//   ''
// )

// (async () => {
//   try {
//     await sendEmail(
//       'This is the plain text version of the email.',
//       'Welcome to Map of Pi!',
//       'recipient@example.com',
//       '<p>Welcome to <strong>Map of Pi</strong>! Your account is now active.</p>'
//     );
//     logger.info('Email sent successfully.');
//   } catch (error) {
//     logger.error('Error sending email:', error);
//   }
// })();
