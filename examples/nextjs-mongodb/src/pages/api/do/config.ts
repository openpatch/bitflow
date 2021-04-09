import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  return res.json({
    config: {
      soundUrls: {
        correct: "/correct.mp3",
        wrong: "/wrong.mp3",
        unknown: "/unknown.mp3",
        manual: "/manual.mp3",
      },
    },
  });
});

export default nc;
