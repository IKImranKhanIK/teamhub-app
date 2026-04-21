import toast from "react-hot-toast";

const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
};

export default notify;
