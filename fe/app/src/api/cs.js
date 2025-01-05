import { beInstance } from "../utils";

export const beCsPoster = async () => {
    try {
        return await beInstance.get("/api/v1/cashshop/poster");
    } catch (error) {
        throw error;
    }
}

export const beCsType = async () => {
    try {
        return await beInstance.get("/api/v1/cashshop/type");
    } catch (error) {
        throw error;
    }
}

export const beItemList = async (page, limit, category, keyword) => {
    try {
        return await beInstance.get("/api/v1/cashshop/items", {
            params: {
                page: page,
                limit: limit,
                category: category,
                keyword: keyword
            }
        });
    } catch (error) {
        throw error;
    }
}

export const beItemGift = async (shopId, accept, birthday) => {
    try {
        return await beInstance.post("/api/v1/cashshop/gift", {
            shop_id: shopId,
            accept: accept,
            birthday: birthday
        });
    } catch (error) {
        throw error;
    }
}

export const beCSHelper = async () => {
    try {
        return await beInstance.get("/api/csh");
    } catch (error) {
        throw error;
    }
}