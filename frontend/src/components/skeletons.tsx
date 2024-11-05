// Loading animation
const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

export function InputSkeleton() {
  return (
      <div className="flex flex-col gap-4 w-full mb-4">
        <div className="flex gap-4 items-center w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="skeleton h-6 w-28 bg-gray-lightest dark:bg-gray-70 rounded-md"> </div>
            <div className="skeleton h-12 w-full bg-gray-lightest dark:bg-gray-dark rounded-md"> </div>
          </div>
        </div>
      </div>
  )
}
export function SingleInputSkeleton(props:React.PropsWithChildren) {
  return (<div className="skeleton h-10 w-full bg-gray-lightest dark:bg-gray-70 rounded-md"></div>)
}
interface FormSkeletonProps {
  numInputs?: number;
  className?: string
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ numInputs = 3, className='' }) => {
  const inputSkeletons = [];

  for (let i = 0; i < numInputs; i++) {
    inputSkeletons.push(<InputSkeleton key={i} />);
  }

  return (
    <div className={`pt-8 ${className}`}>
      {inputSkeletons}
    </div>
  );

}
export function CardSkeleton() {
  return (
    <div
      className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-lightest dark:bg-gray-70 p-2 shadow-sm`}
    >
      <div className="flex p-4">
        <div className="h-5 w-5 rounded-md bg-gray-lighter" />
        <div className="ml-2 h-6 w-16 rounded-md bg-gray-lighter text-sm font-medium" />
      </div>
      <div className="flex items-center justify-center truncate rounded-xl bg-white px-4 py-8">
        <div className="h-7 w-20 rounded-md bg-gray-lighter" />
      </div>
    </div>
  );
}

export function CardsSkeleton() {
  return (
    <>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </>
  );
}

export function RevenueChartSkeleton() {
  return (
    <div className={`${shimmer} relative w-full overflow-hidden md:col-span-4`}>
      <div className="mb-4 h-8 w-36 rounded-md bg-gray-lightest" />
      <div className="rounded-xl bg-gray-lightest p-4">
        <div className="mt-0 grid h-[410px] grid-cols-12 items-end gap-2 rounded-md bg-white p-4 sm:grid-cols-13 md:gap-4" />
        <div className="flex items-center pb-2 pt-6">
          <div className="h-5 w-5 rounded-full bg-gray-lighter" />
          <div className="ml-2 h-4 w-20 rounded-md bg-gray-lighter" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex flex-row items-center justify-between border-b bg-gray-lightest dark:bg-gray-dark border-white dark:border-gray-darker rounded-md m-2 py-4">
      
    </div>
  );
}
interface TableSkeletonProps {
  numRows?: number;
}
export const TableSkeleton: React.FC<TableSkeletonProps> = ({ numRows = 20 }) => {
  const rowSkeletons = Array.from({ length: numRows }, (_, i) => <RowSkeleton key={i} />);
  return (
    <div className={`${shimmer} relative flex w-full flex-col overflow-hidden md:col-span-4 lg:col-span-4 dark:bg-gray-darkest `}>
      <div className="mb-4 h-8 w-36 rounded-md bg-gray-lightest dark:bg-gray-darkest" />
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-lightest dark:bg-gray-darkest p-4">
        <div className="bg-white dark:bg-gray-dark">
        {rowSkeletons}
          
          
        </div>
      </div>
    </div>
  );
}
interface RowsSkeletonProps {
  numRows?: number;
}
export const RowsSkeleton: React.FC<RowsSkeletonProps> = ({ numRows = 3 }) => {
  let rowSkeletons = []
  for (let i = 0; i < numRows; i++) {
    rowSkeletons.push(<RowSkeleton key={i} />);
  }
  return(
    <div className="bg-white dark:bg-gray-darkest">
      {rowSkeletons}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <>
      <div
        className={`${shimmer} relative mb-4 h-8 w-36 overflow-hidden rounded-md bg-gray-lightest`}
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChartSkeleton />
        <TableSkeleton />
      </div>
    </>
  );
}



export function InvoicesMobileSkeleton() {
  return (
    <div className="mb-2 w-full rounded-md bg-white p-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-8">
        <div className="flex items-center">
          <div className="mr-2 h-8 w-8 rounded-full bg-gray-lightest"></div>
          <div className="h-6 w-16 rounded bg-gray-lightest"></div>
        </div>
        <div className="h-6 w-16 rounded bg-gray-lightest"></div>
      </div>
      <div className="flex w-full items-center justify-between pt-4">
        <div>
          <div className="h-6 w-16 rounded bg-gray-lightest"></div>
          <div className="mt-2 h-6 w-24 rounded bg-gray-lightest"></div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-10 w-10 rounded bg-gray-lightest"></div>
          <div className="h-10 w-10 rounded bg-gray-lightest"></div>
        </div>
      </div>
    </div>
  );
}


