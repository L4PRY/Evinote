export type SettingsForm = {
	success: boolean;
	message: string | undefined;
	value: any | undefined;
};

export interface SettingsFormReturn {
	username?: SettingsForm;
	email?: SettingsForm;
	oldPassword?: SettingsForm;
	newPassword?: SettingsForm;
}
