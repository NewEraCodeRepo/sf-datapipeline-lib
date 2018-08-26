import { Event, IEventMetadata, ISerde } from "../build/index";

export class SetStateEvent extends Event {
    constructor(public name: string, public state: string) {
        super();
    }
    public type(): string {
        return "com.rbc.offer_platform.events.set_state";
    }
    public key(): string {
        return this.name;
    }
}

export class SetStateEventSerde implements ISerde<SetStateEvent> {
    constructor(private clientId: string) {}
    public deserialize(buf: Buffer): SetStateEvent {
        const doc = JSON.parse(buf.toString());
        const metadata: IEventMetadata = doc.metadata;
        const event = new SetStateEvent(doc.name, doc.state);
        event.metadata = metadata;
        return event;
    }
    public serialize(event: SetStateEvent): Buffer {
        return new Buffer(JSON.stringify({
            metadata: event.metadata,
            name: event.name,
            state: event.state,
        }));
    }
}

export class OfferCreateEvent extends Event {
    constructor(public id: string, public merchantId: string, public name: string, public copyEnglish: string, public copyFrench: string) {
        super();
    }

    public type(): string {
        return "com.rbc.offer_platform.events.create_offer";
    }

    public key(): string {
        return this.id;
    }
}

export class OfferCreateEventSerde implements ISerde<OfferCreateEvent> {
    constructor(private clientId: string) {}
    public deserialize(buf: Buffer): OfferCreateEvent {
        const doc = JSON.parse(buf.toString());
        const metadata: IEventMetadata = doc.metadata;
        const event = new OfferCreateEvent(doc.id, doc.merchantId, doc.name, doc.copyEnglish, doc.copyFrench);
        event.metadata = metadata;
        return event;
    }
    public serialize(event: OfferCreateEvent): Buffer {
        return new Buffer(JSON.stringify({
            copyEnglish: event.copyEnglish,
            copyFrench: event.copyFrench,
            id: event.id,
            merchantId: event.merchantId,
            metadata: event.metadata,
            name: event.name,
        }));
    }
}

export class OfferSetEvent extends Event {
    constructor(public id: string, public merchantId: string, public name: string, public copyEnglish: string, public copyFrench: string) {
        super();
    }

    public type(): string {
        return "com.rbc.offer_platform.events.set_offer";
    }

    public key(): string {
        return this.id;
    }
}

export class OfferSetEventtSerde implements ISerde<OfferSetEvent> {
    constructor(private clientId: string) {}
    public deserialize(buf: Buffer): OfferSetEvent {
        const doc = JSON.parse(buf.toString());
        const metadata: IEventMetadata = doc.metadata;
        const event = new OfferSetEvent(doc.id, doc.merchantId, doc.name, doc.copyEnglish, doc.copyFrench);
        event.metadata = metadata;
        return event;
    }
    public serialize(event: OfferSetEvent): Buffer {
        return new Buffer(JSON.stringify({
            copyEnglish: event.copyEnglish,
            copyFrench: event.copyFrench,
            id: event.id,
            merchantId: event.merchantId,
            metadata: event.metadata,
            name: event.name,
        }));
    }
}
