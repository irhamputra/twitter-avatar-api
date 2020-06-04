import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cheerio from 'cheerio';
import axios from 'axios';

const app = express();
app.use(cors());

interface Cache {
  url: string;
  html?: string;
}

const cache: { [key: string]: Cache } = {};

const getAvatar = async (username: string) => {
  if (cache[username]) return cache[username];

  try {
    const twitterUrl = `https://mobile.twitter.com/${username}`;

    const response = await axios.get(twitterUrl);
    const { data } = await response;

    const $ = cheerio.load(data);
    const avatar = ($('.avatar img').attr('src') || '').replace(
      '_normal',
      '_200x200'
    );

    const result = {
      url: avatar,
      html: '<img src="' + avatar + '" alt="avatar" />',
    };

    cache[username] = { ...result };

    return result;
  } catch (e) {
    return e.message;
  }
};

app.get(
  '/:username',
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;
    const { url, html } = (await getAvatar(username)) as Cache;

    if (!url) return next(404);

    res.status(200).json({
      url,
      html,
    });
  }
);

app.get(
  '/:username/url',
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;
    const { url } = (await getAvatar(username)) as Cache;

    if (!url) return next(404);

    res.status(200).json({ url });
  }
);

app.listen(8080, () => console.log('Running on port 8080'));
