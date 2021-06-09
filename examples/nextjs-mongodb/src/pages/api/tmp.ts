import { connectToDatabase } from "@db";
import { auth } from "@middlewares/auth";
import { connect } from "@middlewares/connect";
import { Activity } from "@schemas/activity";
import { findActivityById, updateActivity } from "db/activities";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }

    const { db } = await connectToDatabase();
    const activity = await findActivityById(db, "6072c68160e237a8985bb5e6");
    if (activity) {
      const model: Activity["model"] = {
        nodes: {
          "45a2e52f-7ef9-468d-a377-1b09ded7179e": {
            position: {
              x: 843,
              y: -133.5,
            },
          },
          "12ca1039-e872-4eca-b227-e21018ee555d": {
            position: {
              x: -157,
              y: 240.1999969482422,
            },
          },
          "52584b2b-608e-44ae-995b-35e086ade0d9": {
            position: {
              x: 253,
              y: 390.1999969482422,
            },
          },
          "70045660-5ce5-4aee-8595-21e138cfd125": {
            position: {
              x: 1125.2630242833707,
              y: 370.4285257324648,
            },
          },
          "a1c691b3-9395-419d-b79f-f8df2a791f6c": {
            position: {
              x: 1112.2630242833707,
              y: 489.4285257324649,
            },
          },
          "14abdd58-5a56-4132-ba40-def3fac4deb0": {
            position: {
              x: 252.26302428337067,
              y: 10.428525732464777,
            },
          },
          "63d34862-476c-4f09-a4c1-e8469bd444ae": {
            position: {
              x: 678.2630242833707,
              y: 247.42852573246478,
            },
          },
          "bbd56c39-d515-4f6f-9ec8-e2a761d7552a": {
            position: {
              x: 655.2630242833707,
              y: 130.4285257324649,
            },
          },
          "9bbb0330-4c95-455d-ac1a-20348b032752": {
            position: {
              x: 705.2630242833707,
              y: 357.4285257324648,
            },
          },
          "c5420a72-3959-491a-88de-2dafd3ed8e80": {
            position: {
              x: 766.2630242833707,
              y: 20.42852573246489,
            },
          },
          "04645e2a-0617-4007-81a7-acf11ab34938": {
            position: {
              x: 259.26302428337067,
              y: -107.57147426753517,
            },
          },
          "50bd2282-39cc-4d60-8cda-06585ee383d5": {
            position: {
              x: -141.73697571662944,
              y: 351.42852573246483,
            },
          },
          "59c7163b-f626-4e08-af43-0c62712071e2": {
            position: {
              x: -115.73697571662933,
              y: 117.42852573246478,
            },
          },
          "8ef094f8-760f-4e8d-8374-896510f10f1f": {
            position: {
              x: 164.26302428337067,
              y: 617.4285257324648,
            },
          },
          "dab5c2bb-1c40-4ee2-84d3-980378f42b08": {
            position: {
              x: 304.26302428337067,
              y: 505.4285257324648,
            },
          },
          "1848d78b-ce2a-4eaf-961a-141885df17af": {
            position: {
              x: 1105.2630242833707,
              y: 72.42852573246483,
            },
          },
          "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac": {
            position: {
              x: 1140.2630242833707,
              y: -40.57147426753522,
            },
          },
          "2b71c016-7dbb-4b0d-81cc-1d07d332f595": {
            position: {
              x: 1598.2630242833707,
              y: 222.42852573246478,
            },
          },
        },
        latentVariables: [
          {
            type: "latent-variable",
            data: { title: "Expressions" },
            id: "a1822885-a4e0-492b-9fbf-960c01268caa",
            position: { x: 529.8627955824647, y: -35.88464342285158 },
          },
          {
            type: "latent-variable",
            data: { title: "Data Types" },
            id: "f5706623-b13a-47af-9e79-bee496729ec3",
            position: { x: 247.0069144400495, y: 265.69183200748756 },
          },
          {
            type: "latent-variable",
            data: { title: "Pointer" },
            id: "801546f6-6fc5-4591-824c-12e220dca7b4",
            position: { x: 608.2142607233332, y: 530.467750292898 },
          },
          {
            type: "latent-variable",
            data: { title: "Control Structures" },
            id: "d6869963-e919-47c5-9fb7-691f3a644019",
            position: { x: 1060.7275087279734, y: 229.98704457598836 },
          },
          {
            type: "latent-variable",
            data: { title: "Data Structures" },
            id: "b2e98126-da17-474c-b7ec-defd8e25237c",
            position: { x: 1434.183575585365, y: 38.01865828883784 },
          },
          {
            type: "latent-variable",
            data: { title: "Procedures" },
            id: "efd6370d-1c27-4c98-8cba-06be6ae50951",
            position: { x: 1492.9832041554123, y: 446.723445720337 },
          },
          {
            type: "latent-variable",
            data: { title: "Algorithm" },
            id: "ca60193d-f3ae-45bd-964c-efbc9083d6b3",
            position: { x: 1171.8786024388894, y: -121.3723239930925 },
          },
        ],
        edges: [
          {
            source: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
            target: "ca60193d-f3ae-45bd-964c-efbc9083d6b3",
            id: "81b01cb3-ab71-4953-81ed-dbbebf5e09e1",
          },
          {
            source: "04645e2a-0617-4007-81a7-acf11ab34938",
            target: "a1822885-a4e0-492b-9fbf-960c01268caa",
            id: "e0595a47-8171-4e1b-a91e-72088efbfb6d",
          },
          {
            source: "14abdd58-5a56-4132-ba40-def3fac4deb0",
            target: "a1822885-a4e0-492b-9fbf-960c01268caa",
            id: "8290c16c-d702-43ba-8150-0c3fc1956cb2",
          },
          {
            source: "59c7163b-f626-4e08-af43-0c62712071e2",
            target: "f5706623-b13a-47af-9e79-bee496729ec3",
            id: "b866afb1-5dfd-4e72-9d9a-c9e55779f0cc",
          },
          {
            source: "12ca1039-e872-4eca-b227-e21018ee555d",
            target: "f5706623-b13a-47af-9e79-bee496729ec3",
            id: "ca9f6ae5-4637-4324-9d66-d16432cc8bcc",
          },
          {
            source: "50bd2282-39cc-4d60-8cda-06585ee383d5",
            target: "f5706623-b13a-47af-9e79-bee496729ec3",
            id: "93fef08e-7688-4ce5-a721-686edddf629a",
          },
          {
            source: "52584b2b-608e-44ae-995b-35e086ade0d9",
            target: "801546f6-6fc5-4591-824c-12e220dca7b4",
            id: "dd4ca368-aa43-4f20-a552-fa75dbf13300",
          },
          {
            source: "dab5c2bb-1c40-4ee2-84d3-980378f42b08",
            target: "801546f6-6fc5-4591-824c-12e220dca7b4",
            id: "5830f156-b405-46cf-8a1f-19bfeda5a256",
          },
          {
            source: "8ef094f8-760f-4e8d-8374-896510f10f1f",
            target: "801546f6-6fc5-4591-824c-12e220dca7b4",
            id: "4b7006fe-0d5b-493a-a0d2-f4d08deb6156",
          },
          {
            source: "c5420a72-3959-491a-88de-2dafd3ed8e80",
            target: "d6869963-e919-47c5-9fb7-691f3a644019",
            id: "524af9ce-a27a-4a06-b18a-7cf863eab8da",
          },
          {
            source: "bbd56c39-d515-4f6f-9ec8-e2a761d7552a",
            target: "d6869963-e919-47c5-9fb7-691f3a644019",
            id: "c0ac87c2-66c0-4d15-a568-52396c848695",
          },
          {
            source: "63d34862-476c-4f09-a4c1-e8469bd444ae",
            target: "d6869963-e919-47c5-9fb7-691f3a644019",
            id: "c503cfa8-8f31-4a18-a94b-1a8f2f0902fb",
          },
          {
            source: "9bbb0330-4c95-455d-ac1a-20348b032752",
            target: "d6869963-e919-47c5-9fb7-691f3a644019",
            id: "2b282ee3-0ddd-486a-a8fc-55ede19dc8b2",
          },
          {
            source: "70045660-5ce5-4aee-8595-21e138cfd125",
            target: "efd6370d-1c27-4c98-8cba-06be6ae50951",
            id: "747b3d77-c5dd-427d-b5a1-0dd59ea2aac1",
          },
          {
            source: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
            target: "efd6370d-1c27-4c98-8cba-06be6ae50951",
            id: "0948f277-0435-4a8b-9649-038012fc8242",
          },
          {
            source: "1848d78b-ce2a-4eaf-961a-141885df17af",
            target: "b2e98126-da17-474c-b7ec-defd8e25237c",
            id: "27f71901-0547-44b9-948a-ae304a419542",
          },
          {
            source: "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac",
            target: "b2e98126-da17-474c-b7ec-defd8e25237c",
            id: "2eb2580b-2943-4f21-bf7c-9c8a6ee15bbb",
          },
        ],
      };

      updateActivity(db, activity._id, { model });

      return res.status(200).json({
        activity,
      });
    }
  });

export default handler;
