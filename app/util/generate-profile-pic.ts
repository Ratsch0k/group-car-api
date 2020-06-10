import {createCanvas, registerFont} from 'canvas';
import prng from './prng';
import hashString from './hash-string/hash-string';

registerFont('app/assets/Roboto-Regular.ttf', {family: 'Roboto'});

/**
 * Generates a pseudo-random generated profile picture for
 * the given username. The first to characters will be
 * shown inside the pb.
 * @param dim      - Dimension of profile picture in pixel
 *                  (will be used for width and height)
 * @param username - The username for which to create the pb
 * @param offset   - Offset for the randomness. Used to creates a
 *                   different picture for the same username
 */
const generateProfilePic = (dim: number,
    username: string,
    offset: number): Promise<Buffer> => {
  // Get a pseudo random number for the username and offset
  return hashString(username, offset).then((hash) => {
    const rnd = prng(hash);

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
    ctx.font = `${center * 1.3}px Roboto`;
    ctx.fillStyle = `hsl(${deg}, 90%, ${textLightness}%)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = username.slice(0, 2);
    ctx.fillText(text, center, center);

    return canvas.toBuffer('image/jpeg', {quality: 0.9});
  });
};

export default generateProfilePic;
