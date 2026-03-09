import {
	formatBusinessCurrentDate,
	getBusinessGreeting,
} from "@/lib/utils/date";

export const formatCurrentDate = (date = new Date()) =>
	formatBusinessCurrentDate(date);

export const getGreeting = (date = new Date()) => getBusinessGreeting(date);
