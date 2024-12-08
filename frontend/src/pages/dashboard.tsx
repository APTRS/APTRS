import { WithAuth } from "../lib/authutils";
import Projects from "./projects/projects";

import PageTitle from '../components/page-title';

const Dashboard = () => {
  return (
    <>
      <div className="mb-6">
        <PageTitle title={'My Projects'} />
      </div>
      <div className="w-full">
        <div className="w-full">
          <Projects pageTitle='' embedded={true} mine={true} />
        </div>
      </div>
    </>
  );
};


export default WithAuth(Dashboard);