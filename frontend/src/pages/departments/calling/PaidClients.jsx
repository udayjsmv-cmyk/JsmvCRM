import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const PaidClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="Paid Clients" />;
};

export default PaidClients;
