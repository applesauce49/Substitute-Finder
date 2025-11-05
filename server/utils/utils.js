import fetch from "node-fetch";
import { corsOptions } from "../config/corsOptions";

/**
 * Posts a message card to a Google Chat webhook.
 * 
 * @param {Object} options
 * @param {string} options.title - Header title (e.g., "New Job Posted")
 * @param {string} [options.subtitle] - Header subtitle
 * @param {string} [options.imageUrl] - Optional header image/icon
 * @param {string} [options.text] - Main body text (HTML allowed)
 * @param {Array<{ text: string, url: string }>} [options.buttons] - Buttons for the card
 * @param {string} [options.webhookUrl] - Override default webhook (optional)
 */
export async function postToGoogleChat({
    title,
    subtitle,
    imageUrl,
    text,
    buttons = [],
    webhookUrl = process.env.GOOGLE_WEBHOOK_URL,
}) {
    if (!webhookUrl) {
        console.error("[Google Chat] No webhook URL configured.");
        return;
    }

    const card = {
        cardsV2: [
            {
                cardId: "job_post",
                card: {
                    header: {
                        title,
                        subtitle,
                        imageUrl,
                    },
                    sections: [
                        {
                            widgets: [
                                text
                                    ? { textParagraph: { text } }
                                    : null,
                                buttons.length > 0
                                    ? [{
                                        buttonList: {
                                            buttons: buttons.map(({ text, url }) => ({
                                                text,
                                                onClick: {
                                                    openLink: { url },
                                                },
                                            })),
                                        },
                                    }]
                                    : [],
                            ].filter(Boolean),
                        },
                    ],
                },
            },
        ],
    };

    const response = await fetch(webhookUrl, {
        method: "POST",
        header: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
    });

    if (!response.ok) {
        console.error(`[Google Chat] Failed to post job: ${response.status} ${response.statusText}`);
    } else {
        console.log("[Google Chat] Job posted successfully.");
    }
}

