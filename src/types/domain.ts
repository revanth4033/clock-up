/** Domain models (camelCase) mapped from DB rows by the repository layer. */

export type OfficeLocation = {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
};

export type UserProfile = {
  id: string;
  employeeId: string;
  fullName: string;
  officeEmail: string;
  designation: string;
  officeLocationId: string;
  avatarUrl: string | null;
};
