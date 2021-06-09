module.exports = {
  future: {
    webpack5: false,
  },
  async redirects() {
    return [
      {
        source: "/admin/activities/:id/report",
        destination: "/admin/activities/:id/report/flow",
        permanent: true,
      },
    ];
  },
};
