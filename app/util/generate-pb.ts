import {createCanvas, registerFont} from 'canvas';
import prng from './prng';
import hashString from './hash-string';

registerFont('app/assets/Roboto-Regular.ttf', {family: 'Roboto'});

const generatePb = (dim: number,
    username: string,
    offset: number): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    // Get a pseudo random number for the username and offset
    const rnd = prng(hashString(username, offset));

    const canvas = createCanvas(dim, dim);
    const ctx = canvas.getContext('2d');

    const isInverted = rnd >= 0.5;

    const deg: number = Math.floor(rnd * 360);
    const textLightness = isInverted ? 90 : 20;
    const backLightness = isInverted ? 20 : 90;
    const center = Math.floor(dim / 2);

    // Fill with gradient
    ctx.fillStyle = `hsl(${deg}, 90%, ${backLightness}%)`;
    ctx.fillRect(0, 0, dim, dim);
    ctx.font = `${center}px Roboto`;
    ctx.fillStyle = `hsl(${deg}, 90%, ${textLightness}%)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = username.slice(0, 2);
    ctx.fillText(text, center, center);

    resolve(canvas.toBuffer('image/jpeg', {quality: 0.9}));
  });
};

export default generatePb;
