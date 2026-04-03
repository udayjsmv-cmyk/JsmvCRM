import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const HighIncomeClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="High Income Clients" />;
};

export default HighIncomeClients;
