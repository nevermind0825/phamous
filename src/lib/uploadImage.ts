import Parse from "parse/node";

const PARSE_SERVER_URL = "https://phiat.exchange:443/parse";
const PARSE_APP_ID = "Ot3wHoK1yU2I0L5Ef6I4jL2eM16bbSqzq7LbJWNr";
Parse.initialize(PARSE_APP_ID, undefined, undefined);
Parse.serverURL = PARSE_SERVER_URL;

export default async function uploadImage(image: string) {
  const file = new Parse.File("s.jpg", { base64: image });
  try {
    await file.save();
    return file.url();
  } catch (e) {
    // console.log(e);
    return undefined;
  }
}
