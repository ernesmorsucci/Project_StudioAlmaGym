import { userService } from "../services/index.service";
import { createHash } from "../utils/hash.js";

const getAllUsers = async(req,res)=>{
    const users = await userService.getAll();
    return res.json({ status: 'success', payload: users });
}
const getUser = async(req,res)=>{
    const uId = req.params.uid
    const user = await userService.getBy(uId);
    return res.json({ status: 'success', payload: user });
}
const addUser = async(req,res)=>{
    const { name, email, password, phone, rol, speciality } = req.body;
    const exists = await userService.findByEmail(email);
    if(exists) return res.json({ status: 'error', error: 'Users alredy exists' });
    const hashedPassword = await createHash(password);
    const newUser = await userService.create(name,email,hashedPassword,phone,rol,speciality);
    return res.json({ status: 'success', payload: newUser });
}
const updateUser = async(req,res)=>{
    const uId = req.params.uid;
    const { name, email, password, phone, rol, speciality } = req.body;
    const hashedPassword = await createHash(password);
    const updatedUser = await userService.update(uId, name, email, hashedPassword, phone, rol, speciality);
    return res.json({ status: 'success', payload: updatedUser });
}
const deleteUser = async(req,res)=>{
    const uId = req.params.uid;
    const deletedUser = await userService.delete(uId);
    return res.json({ status: 'success', payload: deletedUser });
}
const getByEmail = async(req,res)=>{
    const email = req.params.email;
    const user = await userService.findByEmail(email);
    return res.json({ status: 'success', payload: user });
}
const getAllByRole = async(req,res)=>{
    const role = req.params.role;
    const users = await userService.getAll({ role: role });
    return res.json({ status: 'success', payload: users });
}