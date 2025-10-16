
export const getAdminMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem('adminMode') === 'true';
};

export const setAdminMode = (isAdmin: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminMode', isAdmin.toString());
  }
};
