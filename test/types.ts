import sift from "..";

sift({ $gt: 10 });
sift({ $gt: "10" });
sift({ $gt: new Date(10) });

sift({ $gte: 10 });
sift({ $gte: "10" });
sift({ $gte: new Date(10) });

sift({ $lt: 10 });
sift({ $lt: "10" });
sift({ $lt: new Date(10) });

sift({ $lte: 10 });
sift({ $lte: "10" });
sift({ $lte: new Date(10) });
