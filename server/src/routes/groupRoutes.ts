import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createGroup, getUserGroups, getGroupById, updateGroup,
  addMembers, removeMember, sendGroupMessage, getGroupMessages,
} from '../controllers/groupController';
import {
  validate, createGroupSchema, updateGroupSchema, groupIdSchema,
  addMembersSchema, removeMemberSchema, sendGroupMessageSchema, getGroupMessagesSchema,
} from '../middleware/validation';

const router = Router();

router.post('/', authenticate, validate(createGroupSchema), createGroup);
router.get('/', authenticate, getUserGroups);
router.get('/:id', authenticate, validate(groupIdSchema), getGroupById);
router.put('/:id', authenticate, validate(updateGroupSchema), updateGroup);
router.post('/:id/members', authenticate, validate(addMembersSchema), addMembers);
router.delete('/:id/members/:userId', authenticate, validate(removeMemberSchema), removeMember);
router.post('/message', authenticate, validate(sendGroupMessageSchema), sendGroupMessage);
router.get('/:groupId/messages', authenticate, validate(getGroupMessagesSchema), getGroupMessages);

export default router;
