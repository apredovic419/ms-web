import { beInstance } from "../utils";


export const beNoticeList = async (size, page = 1) => {
    try {
        return await beInstance.get("/api/v1/notice/list", {
            params: {
                size,
                page
            }
        });
    } catch (error) {
        throw error;
    }
}

export const beNoticeDetail = async (id) => {
    try {
        return await beInstance.get("/api/v1/notice/" + id);
    } catch (error) {
        throw error;
    }
}