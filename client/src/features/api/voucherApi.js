import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const voucherApi = createApi({
  reducerPath: "voucherApi",
  tagTypes: ["Vouchers"],
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/api/v1/voucher",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createVoucher: builder.mutation({
      query: (voucherData) => ({
        url: "/create",
        method: "POST",
        body: voucherData,
      }),
      invalidatesTags: ["Vouchers"],
    }),
    getAllVouchers: builder.query({
      query: () => "/",
      providesTags: ["Vouchers"],
    }),
    updateVoucher: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["Vouchers"],
    }),
    deleteVoucher: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vouchers"],
    }),
    validateVoucher: builder.mutation({
      query: (data) => ({
        url: "/validate",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateVoucherMutation,
  useGetAllVouchersQuery,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useValidateVoucherMutation,
} = voucherApi;
