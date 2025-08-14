import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.MAILTRAP_TOKEN;

if(!TOKEN){
    throw new Error("MAILTRAP_TOKEN and MAILTRAP_ENDPOINT must be set");
}

export const mailtrapClient = new MailtrapClient({
    token: TOKEN,
    
});

export const sender = {
    email: "hello@demomailtrap.co",
    name: "Ramazan Çavuş",
};
