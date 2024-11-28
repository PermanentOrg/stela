import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { verifyUserAuthentication } from "../middleware";
import { getFolderById, patchFolder } from "./service";
import {
  validatePatchFolderRequest,
  validateFolderRequest,
} from "./validators";
import { isValidationError } from "../validators/validator_util";

export const folderController = Router();

folderController.patch(
  "/:folderId",
  verifyUserAuthentication,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateFolderRequest(req.params);
      validatePatchFolderRequest(req.body);
      const folderId = await patchFolder(req.params.folderId, req.body);
      const folder = await getFolderById({
        folderId,
      });

      res.status(200).send({ data: folder });
    } catch (err) {
      if (isValidationError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);
