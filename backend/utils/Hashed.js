import bcrypt from "bcryptjs";

export async function hashString(str) {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(str, salt);
}
