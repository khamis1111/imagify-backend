const userModel = require("../models/user.model.js");
const axios = require("axios");
const FormData = require("form-data");

const imageGenerate = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.userId;

    const user = await userModel.findById(userId);

    if (!user)
      return res
        .status(404)
        .json({ status: "fail", msg: "Unauthorized, login again!" });

    if (user.creditBalance === 0)
      return res.status(404).json({
        status: "fail",
        msg: "There are no credits, buy to continue!",
      });

    if (!prompt)
      return res.status(404).json({
        status: "fail",
        msg: "Prompt is required",
      });

    const form = new FormData();
    form.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      form,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = Buffer.from(data, "base64").toString("base64");
    const result = `data:image/jpg;base64,${base64Image}`;

    await userModel.findByIdAndUpdate(userId, {
      creditBalance: user.creditBalance - 1,
    });

    res.status(200).json({
      status: "success",
      creditBalance: user.creditBalance - 1,
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      status: "fail",
      msg: error,
    });
  }
};

module.exports = { imageGenerate };
