import { set } from "mongoose";
import Modal from "react-modal";

function DeleteConfirmationModal({ isOpen, setIsOpen }) {
  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen}>
      <h1>Are you sure?</h1>
      <h3>
        <p>Are you sure you want to delete this item?</p>
      </h3>
      <h3>
        <button onClick={closeModal}>Cancel</button>
        <button variant="danger">Delete</button>
      </h3>
    </Modal>
  );
}

export default DeleteConfirmationModal;
