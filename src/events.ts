import { Event, IEventMetadata, ISerde } from "./index";

export interface ISObject {
    id: string;
}

export interface IOffer extends ISObject {
    bannerClickDirection: string;
    bannerSchedulerTimeJSON: string;
    barCodeType: string;
    barCode: string;
    benefitToCustomer: string;
    campaignEndDate: Date;
    campaignStartDate: Date;
    clickLimit: number;
    descriptionFr: string;
    description: string;
    displayNameEn: string;
    displayNameFr: string;
    isEmergencyInterceptOffer: boolean;
    isFeatured: boolean;
    isInterceptOffer: boolean;
    isLandingPageModal: boolean;
    isODReady: boolean;
    isReadyToUseByClient: boolean;
    isRedeemable: boolean;
    isTargeted: boolean;
    isTrackingRefunds: boolean;
    isWMReady: boolean;
    longTCEnglish: string;
    longTCFrench: string;
    merchantURLFR: string;
    merchantURL: string;
    merchantId: string;
    name: string;
    numOfDaysDisplayLimitApplies: number;
    numOfTimesOfferDisplayed: number;
    offerId: string;
    program: string;
    ranking: number;
    status: string;
    urlEn: string;
    urlFr: string;
    validFromDate: Date;
    validToDate: Date;
    promoCode: string;
    rebateAmount: number;
    rebateType: string;
    redemptionEvent: string;
    redemptionLimitType: string;
    redemptionLimit: number;
    requiresEnrollment: boolean;
    requiresLinkToProfile: boolean;
    runningLinkToProfileCount: number;
    runningPotentialSavingsAmount: number;
    runningRedemptionAmount: number;
    shortDescriptionFr: string;
    shortDescription: string;
    shortTCEnglish: string;
    shortTCFrench: string;
}

// OfferCategory
export interface IOfferCategory extends ISObject {
    apiName: string;
    categoryEn: string;
    categoryFr: string;
    name: string;
}

// OfferCreative
export interface IOfferCreative extends ISObject {
    altText: string;
    contentType: string;
    creativeType: string;
    language: string;
    name: string;
    offer: string;
    iFrameURL: string;
    imageURL: string;
}

// OfferToOfferCategory
export interface IOfferToOfferCategory extends ISObject {
    name: string;
    offerCategoryId: string;
    offerId: string;
}

// OfferToProduct
export interface IOfferToProduct extends ISObject {
    name: string;
    offerId: string;
    productId: string;
}

// Product
export interface IProduct extends ISObject {
    basePoints: number;
    ddaAccountClassificationCode: string;
    ddaAccountTypeCode: string;
    ddaServiceFeeOption: string;
    isEligibleForMyOffers: boolean;
    name: string;
    productCodeExternal: string;
    productCode: string;
    productNameFr: string;
    productTypeExternal: string;
    recordTypeId: string;
    tlpCurrency: string;
}

export enum ObjectType {
    Offer = "offer",
    OfferCategory= "offerCategory",
    OfferCreative = "offerCreative",
    OfferToOfferCategory = "offerToOfferCategory",
    OfferToProduct = "offerToProduct",
    Product = "product",
}

interface IObjectTypeString {
    [index: string]: string;
}

const ObjectTypeStrings: IObjectTypeString = {};
ObjectTypeStrings[ObjectType.Offer] = "OFFER";
ObjectTypeStrings[ObjectType.OfferCategory] = "OFFER_CATEGORY";
ObjectTypeStrings[ObjectType.OfferCreative] = "OFFER_CREATIVE";
ObjectTypeStrings[ObjectType.OfferToOfferCategory] = "OFFER_TO_OFFER_CATEGORY";
ObjectTypeStrings[ObjectType.OfferToProduct] = "OFFER_TO_PRODUCT";
ObjectTypeStrings[ObjectType.Product] = "PRODUCT";

export enum DMLOperation {
    INSERT = "INSERT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}

export class MOPDataChangeEvent extends Event {
    constructor(public objectType: ObjectType, public operation: DMLOperation,
                public sObject: ISObject) {
        super();
    }
    public type(): string {
        return "com.rbc.offer_platform.events.mop_data_change";
    }
    public key(): string {
        return `${ObjectTypeStrings[this.objectType]}|` +
            `${this.operation}|${this.sObject.id}`;
    }
}

export class MOPDataChangeEventSerde implements ISerde<MOPDataChangeEvent> {
    constructor(private clientId: string) {} // tslint:disable-line
    public deserialize(buf: Buffer): MOPDataChangeEvent {
        const doc = JSON.parse(buf.toString());
        const metadata: IEventMetadata = doc.metadata;
        const event = new MOPDataChangeEvent(
            doc.objectType, doc.operation, doc.sObject);
        event.metadata = metadata;
        return event;
    }
    public serialize(event: MOPDataChangeEvent): Buffer {
        return new Buffer(JSON.stringify({
            metadata: event.metadata,
            objectType: event.objectType,
            operation: event.operation,
            sObject: event.sObject,
        }));
    }
}
