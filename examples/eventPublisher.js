"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv_reader_1 = require("../build/csv_reader");
const index_1 = require("../build/index");
const kafka_1 = require("../build/kafka");
const pubsub_1 = require("../build/pubsub");
const index_2 = require("./index");
const readStream = fs.createReadStream(__dirname + "./data.csv");
const hStream = csv_reader_1.csvReader(readStream);
const csvRecord2Event = (rec) => {
    return new index_2.SetStateEvent(rec.Name, rec.State);
};
const clientId = "test.publisher";
const metadataWriter = index_1.buildMetadataWriter(clientId);
kafka_1.buildPublisher("kafka:9092", clientId)
    .then((publisher) => {
    const xform = pubsub_1.buildPublishingTransform(publisher, "test", metadataWriter, new index_2.SetStateEventSerde(clientId));
    hStream
        .map(csvRecord2Event)
        .map(xform)
        .each((x) => {
        console.log(x);
    })
        .done(() => {
        publisher.disconnect()
            .then(() => console.log("Publisher disconnected."))
            .catch((err) => console.error("Publisher disconnect error", err));
    });
})
    .catch((e) => {
    throw e;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50UHVibGlzaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7QUFFYix5QkFBeUI7QUFFekIsb0RBQTREO0FBQzVELDBDQUFrRjtBQUNsRiwwQ0FBZ0Q7QUFDaEQsNENBQTJEO0FBQzNELG1DQUE0RDtBQUU1RCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFdEMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxHQUFlLEVBQWlCLEVBQUU7SUFDdkQsTUFBTSxDQUFDLElBQUkscUJBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUM7QUFFRixNQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQztBQUNsQyxNQUFNLGNBQWMsR0FBRywyQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxzQkFBYyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUM7S0FDakMsSUFBSSxDQUFDLENBQUMsU0FBcUIsRUFBRSxFQUFFO0lBQzVCLE1BQU0sS0FBSyxHQUFHLGlDQUF3QixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLElBQUksMEJBQWtCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RyxPQUFPO1NBQ0YsR0FBRyxDQUFnQixlQUFlLENBQUM7U0FDbkMsR0FBRyxDQUFpQixLQUFLLENBQUM7U0FDMUIsSUFBSSxDQUFDLENBQUMsQ0FBaUIsRUFBRSxFQUFFO1FBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsQ0FBQyxDQUFDO1NBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNQLFNBQVMsQ0FBQyxVQUFVLEVBQUU7YUFDakIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQzthQUNsRCxLQUFLLENBQUMsQ0FBQyxHQUFVLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNqRixDQUFDLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQztLQUNELEtBQUssQ0FBQyxDQUFDLENBQVEsRUFBRSxFQUFFO0lBQ2hCLE1BQU0sQ0FBQyxDQUFDO0FBQ1osQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZXhhbXBsZXMvZXZlbnRQdWJsaXNoZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbmltcG9ydCB7IGNzdlJlYWRlciwgSUNTVlJlY29yZCB9IGZyb20gXCIuLi9idWlsZC9jc3ZfcmVhZGVyXCI7XG5pbXBvcnQgeyBidWlsZE1ldGFkYXRhV3JpdGVyLCBJUHVibGlzaGVyLCBJUHVibGlzaFJlc3VsdCwgfSBmcm9tIFwiLi4vYnVpbGQvaW5kZXhcIjtcbmltcG9ydCB7IGJ1aWxkUHVibGlzaGVyIH0gZnJvbSBcIi4uL2J1aWxkL2thZmthXCI7XG5pbXBvcnQgeyBidWlsZFB1Ymxpc2hpbmdUcmFuc2Zvcm0gfSBmcm9tIFwiLi4vYnVpbGQvcHVic3ViXCI7XG5pbXBvcnQgeyBTZXRTdGF0ZUV2ZW50LCBTZXRTdGF0ZUV2ZW50U2VyZGUgfSBmcm9tIFwiLi9pbmRleFwiO1xuXG5jb25zdCByZWFkU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShfX2Rpcm5hbWUgKyBcIi4vZGF0YS5jc3ZcIik7XG5jb25zdCBoU3RyZWFtID0gY3N2UmVhZGVyKHJlYWRTdHJlYW0pO1xuXG5jb25zdCBjc3ZSZWNvcmQyRXZlbnQgPSAocmVjOiBJQ1NWUmVjb3JkKTogU2V0U3RhdGVFdmVudCA9PiB7XG4gICAgcmV0dXJuIG5ldyBTZXRTdGF0ZUV2ZW50KHJlYy5OYW1lLCByZWMuU3RhdGUpO1xufTtcblxuY29uc3QgY2xpZW50SWQgPSBcInRlc3QucHVibGlzaGVyXCI7XG5jb25zdCBtZXRhZGF0YVdyaXRlciA9IGJ1aWxkTWV0YWRhdGFXcml0ZXIoY2xpZW50SWQpO1xuYnVpbGRQdWJsaXNoZXIoXCJrYWZrYTo5MDkyXCIsIGNsaWVudElkKVxuICAgIC50aGVuKChwdWJsaXNoZXI6IElQdWJsaXNoZXIpID0+IHtcbiAgICAgICAgY29uc3QgeGZvcm0gPSBidWlsZFB1Ymxpc2hpbmdUcmFuc2Zvcm0ocHVibGlzaGVyLCBcInRlc3RcIiwgbWV0YWRhdGFXcml0ZXIsIG5ldyBTZXRTdGF0ZUV2ZW50U2VyZGUoY2xpZW50SWQpKTtcbiAgICAgICAgaFN0cmVhbVxuICAgICAgICAgICAgLm1hcDxTZXRTdGF0ZUV2ZW50Pihjc3ZSZWNvcmQyRXZlbnQpXG4gICAgICAgICAgICAubWFwPElQdWJsaXNoUmVzdWx0Pih4Zm9ybSlcbiAgICAgICAgICAgIC5lYWNoKCh4OiBJUHVibGlzaFJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5kb25lKCgpID0+IHtcbiAgICAgICAgICAgICAgICBwdWJsaXNoZXIuZGlzY29ubmVjdCgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGNvbnNvbGUubG9nKFwiUHVibGlzaGVyIGRpc2Nvbm5lY3RlZC5cIikpXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyOiBFcnJvcikgPT4gY29uc29sZS5lcnJvcihcIlB1Ymxpc2hlciBkaXNjb25uZWN0IGVycm9yXCIsIGVycikpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGU6IEVycm9yKSA9PiB7XG4gICAgICAgIHRocm93IGU7XG4gICAgfSk7XG4iXX0=
