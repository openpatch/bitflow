import m20210425 from "./m20210425";

const migrations = [m20210425];

const up = async () => {
  for (let migration of migrations) {
    console.info(`UP: ${migration.title}`);
    await migration.up();
  }
};

const down = async () => {
  for (let migration of migrations) {
    console.info(`DOWN: ${migration.title}`);
    await migration.down();
  }
};

export default {
  up,
  down,
};
