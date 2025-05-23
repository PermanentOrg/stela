import {
	validateBodyFromAuthentication,
	validateBodyFromAdminAuthentication,
	fieldsFromUserOrAdminAuthentication,
	validateIsAdminFromAuthentication,
	validateOptionalAuthenticationValues,
	validatePaginationParameters,
} from "./shared";

describe("validateBodyFromAuthentication", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is missing", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				userSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is the wrong type", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				emailFromAuthToken: 1,
				userSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is an invalid value", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				emailFromAuthToken: "not_an_email",
				userSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if userSubjectFromAuthToken is missing", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				emailFromAuthToken: "test@permanent.org",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if userSubjectFromAuthToken is the wrong type", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: 1,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if userSubjectFromAuthToken is the wrong format", () => {
		let error = null;
		try {
			validateBodyFromAuthentication({
				emailFromAuthToken: "test@permanent.org",
				userSubjectFromAuthToken: "not_a_uuid",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateBodyFromAdminAuthentication", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				emailFromAuthToken: "test@permanent.org",
				adminSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is missing", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				adminSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is the wrong type", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				emailFromAuthToken: 1,
				adminSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if emailFromAuthToken is an invalid value", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				emailFromAuthToken: "not_an_email",
				adminSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if adminSubjectFromAuthToken is missing", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				emailFromAuthToken: "test@permanent.org",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if adminSubjectFromAuthToken is the wrong type", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				emailFromAuthToken: "test@permanent.org",
				adminSubjectFromAuthToken: 1,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if adminSubjectFromAuthToken is the wrong format", () => {
		let error = null;
		try {
			validateBodyFromAdminAuthentication({
				emailFromAuthToken: "test@permanent.org",
				adminSubjectFromAuthToken: "not_a_uuid",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("fieldsFromUserOrAdminAuthentication", () => {
	const expectFailedValidation = (data: unknown): void => {
		const validation = fieldsFromUserOrAdminAuthentication.validate(data);
		expect(validation.error).toBeTruthy();
	};
	const expectSuccessfulValidation = (data: unknown): void => {
		const validation = fieldsFromUserOrAdminAuthentication.validate(data);
		expect(validation.error).toBeFalsy();
	};
	test("should be invalid if empty", () => {
		expectFailedValidation({});
	});
	test("should be invalid if no subject is present", () => {
		expectFailedValidation({ userEmailFromAuthToken: "test@permanent.org" });
		expectFailedValidation({ adminEmailFromAuthToken: "test@permanent.org" });
	});
	test("should be invalid if no email is present", () => {
		expectFailedValidation({
			userSubjectFromAuthToken: "def2920e-8bfd-451a-bdc8-622f52f3dc02",
		});
		expectFailedValidation({
			adminSubjectFromAuthToken: "def2920e-8bfd-451a-bdc8-622f52f3dc02",
		});
	});
	test("should be invalid if email is not an email", () => {
		expectFailedValidation({
			userEmailFromAuthToken: "not_an_email",
			userSubjectFromAuthToken: "def2920e-8bfd-451a-bdc8-622f52f3dc02",
		});
		expectFailedValidation({
			adminEmailFromAuthToken: "not_an_email",
			adminSubjectFromAuthToken: "def2920e-8bfd-451a-bdc8-622f52f3dc02",
		});
	});
	test("should be invalid if subject is not a uuid", () => {
		expectFailedValidation({
			userEmailFromAuthToken: "test@permanent.org",
			userSubjectFromAuthToken: "not_a_uuid",
		});
		expectFailedValidation({
			adminEmailFromAuthToken: "test@permanent.org",
			adminSubjectFromAuthToken: "not_a_uuid",
		});
	});
	test("should be valid if user email and subject are present", () => {
		expectSuccessfulValidation({
			userEmailFromAuthToken: "test@permanent.org",
			userSubjectFromAuthToken: "51d9cca8-b260-4173-a194-8e10bcf6721e",
		});
	});
	test("should be valid if admin email and subject are present", () => {
		expectSuccessfulValidation({
			adminEmailFromAuthToken: "test@permanent.org",
			adminSubjectFromAuthToken: "51d9cca8-b260-4173-a194-8e10bcf6721e",
		});
	});
	test("should be invalid if both admin and user fields are present", () => {
		expectFailedValidation({
			adminEmailFromAuthToken: "test@permanent.org",
			adminSubjectFromAuthToken: "51d9cca8-b260-4173-a194-8e10bcf6721e",
			userEmailFromAuthToken: "test@permanent.org",
			userSubjectFromAuthToken: "51d9cca8-b260-4173-a194-8e10bcf6721e",
		});
	});
	test("should be invalid if both admin and user fields are mismatched", () => {
		expectFailedValidation({
			adminEmailFromAuthToken: "test@permanent.org",
			userSubjectFromAuthToken: "51d9cca8-b260-4173-a194-8e10bcf6721e",
		});
		expectFailedValidation({
			adminSubjectFromAuthToken: "51d9cca8-b260-4173-a194-8e10bcf6721e",
			userEmailFromAuthToken: "test@permanent.org",
		});
	});
});

describe("validateIsAdminFromAuthentication", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validateIsAdminFromAuthentication({
				admin: true,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should raise an error if admin is missing", () => {
		let error = null;
		try {
			validateIsAdminFromAuthentication({
				userSubjectFromAuthToken: "b2a6787c-f255-465a-8eb0-1583004d4a4f",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should raise an error if admin is the wrong type", () => {
		let error = null;
		try {
			validateIsAdminFromAuthentication({
				admin: "a string",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validateOptionalAuthenticationValues", () => {
	test("should find no error if request body is empty", () => {
		let error = null;
		try {
			validateOptionalAuthenticationValues({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should accept a request with an email and a share token", () => {
		let error = null;
		try {
			validateOptionalAuthenticationValues({
				emailFromAuthToken: "test@permanent.org",
				shareToken: "45e049b8-82c4-4d19-97d5-ff240cf95d73",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});
	test("should error if emailFromAuthToken is not a string", () => {
		let error = null;
		try {
			validateOptionalAuthenticationValues({
				emailFromAuthToken: 0,
				shareToken: "45e049b8-82c4-4d19-97d5-ff240cf95d73",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should error if emailFromAuthToken is not an email", () => {
		let error = null;
		try {
			validateOptionalAuthenticationValues({
				emailFromAuthToken: "not_an_email",
				shareToken: "45e049b8-82c4-4d19-97d5-ff240cf95d73",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
	test("should error if shareToken is not a string", () => {
		let error = null;
		try {
			validateOptionalAuthenticationValues({
				emailFromAuthToken: "test@permanent.org",
				shareToken: 0,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("validatePaginationParameters", () => {
	test("should find no errors in valid parameter set", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: 100,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should not error if cursor is missing", () => {
		let error = null;
		try {
			validatePaginationParameters({
				pageSize: 100,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should error if cursor is not a string", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: 1,
				pageSize: 100,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is missing", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is not a number", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: "not_a_number",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is not an integer", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: 2.5,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if pageSize is less than one", () => {
		let error = null;
		try {
			validatePaginationParameters({
				cursor: "1",
				pageSize: 0,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
