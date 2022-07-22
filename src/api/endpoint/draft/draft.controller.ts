import fetch from "cross-fetch";

export const fetchDraft = async (link: string): Promise<string> => {
  let result = "";
  try {
    const req = await fetch(link, {
      method: "GET",
    });
    const txt = await req.text();
    if (txt) result = txt;
    else throw new Error(`Error in getting text from draft ${link}`);
  } catch (error) {
    console.log(error);
  }

  return result;
};
