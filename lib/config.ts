if (!process.env.HENRY_API_URL) {
  throw new Error('HENRY_API_URL is required. Please set it in your .env file.');
}

if (!process.env.HENRY_API_KEY) {
  throw new Error('HENRY_API_KEY is required. Please set it in your .env file.');
}

export const HENRY_API_URL = process.env.HENRY_API_URL;
export const HENRY_API_KEY = process.env.HENRY_API_KEY;