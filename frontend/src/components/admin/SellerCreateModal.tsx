import React, { useMemo, useState } from "react";
import {
	X,
	User,
	Mail,
	Phone,
	Lock,
	Eye,
	EyeOff,
	Loader2,
	CheckCircle2,
	AlertTriangle
} from "lucide-react";
import { adminApi } from "@/services/admin.service";

type Props = {
	open: boolean;
	onClose: () => void;
	onCreated?: (sellerId: string) => void;
};

type SellerForm = {
	full_name: string;
	email: string;
	phone: string;
	password: string;
	confirmPassword: string;
};

type ValidationErrors = {
	full_name?: string;
	email?: string;
	phone?: string;
	password?: string;
	confirmPassword?: string;
};

const initialSeller: SellerForm = {
	full_name: "",
	email: "",
	phone: "",
	password: "",
	confirmPassword: ""
};

const extractSellerId = (res: any): string | null => {
	if (!res) return null;
	const candidates = [
		res.id,
		res._id,
		res.user?.id,
		res.user?._id,
		res.data?.id,
		res.data?._id
	];
	for (const value of candidates) {
		if (value) return String(value);
	}
	return null;
};

export default function SellerCreateModal({ open, onClose, onCreated }: Props) {
	const [seller, setSeller] = useState<SellerForm>(initialSeller);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [doneId, setDoneId] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

	const canSubmit = useMemo(() => {
		const emailOk = /\S+@\S+\.\S+/.test(seller.email);
		const phoneOk = seller.phone.trim().length >= 9 && /^\d+$/.test(seller.phone);
		const passOk = seller.password.length >= 6 && seller.password === seller.confirmPassword;
		return seller.full_name.trim() && emailOk && phoneOk && passOk;
	}, [seller]);

	const validateForm = (): boolean => {
		const errors: ValidationErrors = {};

		if (!seller.full_name.trim()) {
			errors.full_name = "Họ và tên là bắt buộc";
		}

		if (!seller.email.trim()) {
			errors.email = "Email là bắt buộc";
		} else if (!/\S+@\S+\.\S+/.test(seller.email)) {
			errors.email = "Email không hợp lệ";
		}

		if (!seller.phone.trim()) {
			errors.phone = "Số điện thoại là bắt buộc";
		} else if (!/^\d+$/.test(seller.phone) || seller.phone.trim().length < 9) {
			errors.phone = "Số điện thoại phải có ít nhất 9 chữ số";
		}

		if (!seller.password) {
			errors.password = "Mật khẩu là bắt buộc";
		} else if (seller.password.length < 6) {
			errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
		}

		if (seller.password !== seller.confirmPassword) {
			errors.confirmPassword = "Mật khẩu nhập lại không khớp";
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const resetState = () => {
		setSeller(initialSeller);
		setValidationErrors({});
		setError(null);
		setDoneId(null);
		setShowPassword(false);
		setShowConfirmPassword(false);
	};

	const closeModal = () => {
		if (submitting) return;
		resetState();
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;

		const valid = validateForm();
		if (!valid || !canSubmit) return;

		setSubmitting(true);
		setError(null);
		setDoneId(null);

		try {
			const payload = {
				full_name: seller.full_name.trim(),
				email: seller.email.trim(),
				phone: seller.phone.trim(),
				password: seller.password,
				role: "Seller"
			};

			const response = await adminApi.createUser(payload);
			const newId = extractSellerId(response) || response?.id;

			if (!newId) {
				throw new Error("Không lấy được mã seller vừa tạo. Vui lòng thử lại.");
			}

			setDoneId(newId);
			onCreated?.(newId);

			// Giữ modal thêm một chút để hiển thị trạng thái thành công
			setTimeout(() => {
				closeModal();
			}, 1500);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ||
				err?.message ||
				"Tạo seller thất bại. Vui lòng thử lại.";
			setError(message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleChange = (field: keyof SellerForm, value: string) => {
		setSeller((prev) => ({ ...prev, [field]: value }));
		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white">
					<h2 className="text-lg font-semibold">Thêm seller mới</h2>
					<button
						onClick={closeModal}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						disabled={submitting}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
					{error && (
						<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							<AlertTriangle className="w-4 h-4 mt-0.5" />
							<div>{error}</div>
						</div>
					)}

					{doneId && (
						<div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
							<CheckCircle2 className="w-4 h-4 mt-0.5" />
							<div>Seller đã được tạo thành công (ID: {doneId}).</div>
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
								<User className="w-4 h-4 text-gray-400" />
								<input
									className="flex-1 outline-none bg-transparent"
									placeholder="Họ và tên *"
									value={seller.full_name}
									onChange={(e) => handleChange("full_name", e.target.value)}
									disabled={submitting}
								/>
							</label>
							{validationErrors.full_name && (
								<p className="text-red-500 text-xs mt-1">{validationErrors.full_name}</p>
							)}
						</div>

						<div>
							<label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
								<Mail className="w-4 h-4 text-gray-400" />
								<input
									type="email"
									className="flex-1 outline-none bg-transparent"
									placeholder="Email *"
									value={seller.email}
									onChange={(e) => handleChange("email", e.target.value)}
									disabled={submitting}
								/>
							</label>
							{validationErrors.email && (
								<p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
							)}
						</div>

						<div>
							<label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
								<Phone className="w-4 h-4 text-gray-400" />
								<input
									className="flex-1 outline-none bg-transparent"
									placeholder="Số điện thoại *"
									value={seller.phone}
									onChange={(e) => handleChange("phone", e.target.value)}
									disabled={submitting}
								/>
							</label>
							{validationErrors.phone && (
								<p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
									<Lock className="w-4 h-4 text-gray-400" />
									<input
										type={showPassword ? "text" : "password"}
										className="flex-1 outline-none bg-transparent"
										placeholder="Mật khẩu *"
										value={seller.password}
										onChange={(e) => handleChange("password", e.target.value)}
										disabled={submitting}
									/>
									<button
										type="button"
										className="text-gray-400 hover:text-gray-600"
										onClick={() => setShowPassword((v) => !v)}
										tabIndex={-1}
									>
										{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</label>
								{validationErrors.password && (
									<p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
								)}
							</div>

							<div>
								<label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
									<Lock className="w-4 h-4 text-gray-400" />
									<input
										type={showConfirmPassword ? "text" : "password"}
										className="flex-1 outline-none bg-transparent"
										placeholder="Nhập lại mật khẩu *"
										value={seller.confirmPassword}
										onChange={(e) => handleChange("confirmPassword", e.target.value)}
										disabled={submitting}
									/>
									<button
										type="button"
										className="text-gray-400 hover:text-gray-600"
										onClick={() => setShowConfirmPassword((v) => !v)}
										tabIndex={-1}
									>
										{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</label>
								{validationErrors.confirmPassword && (
									<p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
								)}
							</div>
						</div>
					</div>

					<button
						type="submit"
						className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 text-white py-3 font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
						disabled={!canSubmit || submitting}
					>
						{submitting ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Đang tạo seller...
							</>
						) : (
							<>
								<User className="w-4 h-4" />
								Tạo seller
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
