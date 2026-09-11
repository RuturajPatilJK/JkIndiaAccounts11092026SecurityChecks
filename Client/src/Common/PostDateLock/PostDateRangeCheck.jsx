import { PostDateCheck } from "./PostDateCheck";
import {InwordDateCheck } from "./InwordDateCheck"
import {OutwordDateCheck } from "./OutwordDateCheck"
import Swal from "sweetalert2";

export const PostDateRecordLock = async (docDate, postDate) => {
  if (PostDateCheck(docDate, postDate)) {
    await Swal.fire({
      title: "Locked",
      text: "This record is locked due to PostDateError. Please contact the administrator.",
      icon: "error",
      confirmButtonText: "OK"
    });
    return true;
  }
  return false;
};

export const InWordPostDateRecordLock = async (docDate, postDate, inwardDate) => {
  const checkResult = InwordDateCheck(docDate, postDate, inwardDate);

  if (checkResult.error) {
    let errorMessage = "";

    if (checkResult.type === "PostDate") {
      errorMessage = "This record is locked due to Post Date error. Please contact the administrator.";
    } else if (checkResult.type === "InwardDate") {
      errorMessage = "This record is locked due to Inward Date error. Please contact the administrator.";
    }

    await Swal.fire({
      title: "Locked",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "OK"
    });

    return true;
  }

  return false;
};


export const OutwordPostDateRecordLock = async (docDate, postDate, outworddate) => {
  const checkResult = OutwordDateCheck(docDate, postDate, outworddate);

  if (checkResult.error) {
    let errorMessage = "";

    if (checkResult.type === "PostDate") {
      errorMessage = "This record is locked due to Post Date error. Please contact the administrator.";
    } else if (checkResult.type === "OutwordDate") {
      errorMessage = "This record is locked due to Outward Date error. Please contact the administrator.";
    }

    await Swal.fire({
      title: "Locked",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "OK"
    });

    return true;
  }

  return false;
};

