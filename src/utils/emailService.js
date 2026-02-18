const emailjs = require("@emailjs/nodejs");
const logger = require("./logger");

// Initialize EmailJS with keys
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

/**
 * Send an email notification using EmailJS.
 *
 * @param {Object} params
 * @param {string} params.toEmail    - Recipient's email address
 * @param {string} params.toName     - Recipient's full name
 * @param {string} params.petName    - Name of the pet
 * @param {string} params.status     - "approved" or "rejected"
 */
const sendAdoptionEmail = async ({ toEmail, toName, petName, status }) => {
    try {
        const templateParams = {
            tittle: 'Adoption application notification !!!',
            email: toEmail,
            name: toName,
            message:
                status === "approved"
                    ? `Great news! Your adoption request for "${petName}" has been approved. Please visit us to complete the adoption process.`
                    : `We're sorry to inform you that your adoption request for "${petName}" has been rejected. Feel free to browse other pets available for adoption.`,
        };

        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            templateParams
        );

        logger.info(
            `Adoption ${status} email sent to ${toEmail} (status: ${response.status})`
        );
        return response;
    } catch (error) {
        // Log but don't throw — email failure shouldn't break the adoption flow
        logger.error(
            `Failed to send adoption email to ${toEmail}: ${JSON.stringify(error)}`
        );
        return null;
    }
};

module.exports = { sendAdoptionEmail };
