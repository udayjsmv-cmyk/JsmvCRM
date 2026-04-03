import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const BusinessClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="Business Clients" />;
};

export default BusinessClients;
