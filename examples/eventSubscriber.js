"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafka_1 = require("../build/kafka");
const pubsub_1 = require("../build/pubsub");
const index_1 = require("./index");
const clientId = "example.consumer";
const subscriber = kafka_1.buildSubscriber("kafka:9092", clientId, "my-group-1");
const stream = pubsub_1.buildSubscriptionStream(subscriber, ["test"], new index_1.SetStateEventSerde(clientId));
stream
    .each((del) => {
    console.log(del.key);
    console.log(del.offset);
    console.log(del.event);
})
    .done(() => {
    subscriber.disconnect()
        .then(() => console.log("Consumer disconnected"))
        .catch((err) => console.error("Consumer disconnect error", err));
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50U3Vic2NyaWJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBR2IsMENBQWlEO0FBQ2pELDRDQUEwRDtBQUMxRCxtQ0FBNEQ7QUFFNUQsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUM7QUFDcEMsTUFBTSxVQUFVLEdBQUcsdUJBQWUsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3pFLE1BQU0sTUFBTSxHQUFHLGdDQUF1QixDQUFDLFVBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksMEJBQWtCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMvRixNQUFNO0tBQ0QsSUFBSSxDQUFDLENBQUMsR0FBNkIsRUFBRSxFQUFFO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQztLQUNELElBQUksQ0FBQyxHQUFHLEVBQUU7SUFDUCxVQUFVLENBQUMsVUFBVSxFQUFFO1NBQ2xCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7U0FDaEQsS0FBSyxDQUFDLENBQUMsR0FBVSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEYsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZXhhbXBsZXMvZXZlbnRTdWJzY3JpYmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB7IElEZWxpdmVyeSB9IGZyb20gXCIuLi9idWlsZC9pbmRleFwiO1xuaW1wb3J0IHsgYnVpbGRTdWJzY3JpYmVyIH0gZnJvbSBcIi4uL2J1aWxkL2thZmthXCI7XG5pbXBvcnQgeyBidWlsZFN1YnNjcmlwdGlvblN0cmVhbSB9IGZyb20gXCIuLi9idWlsZC9wdWJzdWJcIjtcbmltcG9ydCB7IFNldFN0YXRlRXZlbnQsIFNldFN0YXRlRXZlbnRTZXJkZSB9IGZyb20gXCIuL2luZGV4XCI7XG5cbmNvbnN0IGNsaWVudElkID0gXCJleGFtcGxlLmNvbnN1bWVyXCI7XG5jb25zdCBzdWJzY3JpYmVyID0gYnVpbGRTdWJzY3JpYmVyKFwia2Fma2E6OTA5MlwiLCBjbGllbnRJZCwgXCJteS1ncm91cC0xXCIpO1xuY29uc3Qgc3RyZWFtID0gYnVpbGRTdWJzY3JpcHRpb25TdHJlYW0oc3Vic2NyaWJlciwgW1widGVzdFwiXSwgbmV3IFNldFN0YXRlRXZlbnRTZXJkZShjbGllbnRJZCkpO1xuc3RyZWFtXG4gICAgLmVhY2goKGRlbDogSURlbGl2ZXJ5PFNldFN0YXRlRXZlbnQ+KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRlbC5rZXkpO1xuICAgICAgICBjb25zb2xlLmxvZyhkZWwub2Zmc2V0KTtcbiAgICAgICAgY29uc29sZS5sb2coZGVsLmV2ZW50KTtcbiAgICB9KVxuICAgIC5kb25lKCgpID0+IHtcbiAgICAgICAgc3Vic2NyaWJlci5kaXNjb25uZWN0KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGNvbnNvbGUubG9nKFwiQ29uc3VtZXIgZGlzY29ubmVjdGVkXCIpKVxuICAgICAgICAgICAgLmNhdGNoKChlcnI6IEVycm9yKSA9PiBjb25zb2xlLmVycm9yKFwiQ29uc3VtZXIgZGlzY29ubmVjdCBlcnJvclwiLCBlcnIpKTtcbiAgICB9KTtcbiJdfQ==