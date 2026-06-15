// src/auth/permissions.js
// Permissions granulaires — infrastructure front.
//
// - PERMISSION_KEYS : clés `can_*` copiées 1:1 du serializer back
//   (ProfileUserAssignmentSerializer, workpermit/users/api/serializers.py).
// - SCOPE_FLAGS : drapeaux de portee exposes par /api/users/my-assignments/.

// ----------------------------------------------------------------------

export const PERMISSION_KEYS = [
  'can_create_declaration', 'can_view_declaration', 'can_edit_declaration',
  'can_delete_declaration', 'can_submit_declaration', 'can_unsubmit_declaration',
  'can_validate_declaration', 'can_reject_declaration', 'can_invoice_declaration',
  'can_duplicate_declaration', 'can_add_employees_to_declaration',
  'can_delete_employees_from_declaration', 'can_move_employees_between_declarations',
  'can_renew_employee_in_declaration', 'can_view_declaration_stats',
  'can_view_declaration_employee', 'can_edit_declaration_employee', 'can_update_employee_file',
  'can_submit_declaration_employee', 'can_validate_declaration_employee',
  'can_correct_declaration_employee', 'can_expire_declaration_employee', 'can_create_employee',
  'can_view_employee', 'can_view_employee_by_passport', 'can_view_pending_print',
  'can_view_printed', 'can_mark_as_printed', 'can_deliver_permit',
  'can_create_employee_document', 'can_view_employee_document', 'can_edit_employee_document',
  'can_delete_employee_document', 'can_create_africanization_plan',
  'can_view_africanization_plan', 'can_edit_africanization_plan',
  'can_delete_africanization_plan', 'can_reassign_africanization_plan', 'can_view_facture',
  'can_view_facture_stats', 'can_mark_facture_paid', 'can_remove_declaration_from_facture',
  'can_view_payment', 'can_edit_payment', 'can_delete_payment', 'can_validate_payment',
  'can_add_factures_to_payment', 'can_remove_factures_from_payment', 'can_view_employee_report',
  'can_view_declaration_report', 'can_view_facture_report', 'can_view_payment_report',
  'can_view_permit_report', 'can_view_agent_dashboard', 'can_view_admin_dashboard',
  'can_view_accountant_dashboard', 'can_view_treasurer_dashboard', 'can_view_aguipe_dashboard',
  'can_view_supervisor_dashboard', 'can_view_permit_dashboard', 'can_create_profile',
  'can_view_profile', 'can_edit_profile', 'can_delete_profile', 'can_create_profile_document',
  'can_view_profile_document', 'can_edit_profile_document', 'can_delete_profile_document',
  'can_create_user', 'can_view_user', 'can_edit_user', 'can_delete_user',
  'can_add_profile_to_user', 'can_enroll_employee_abis', 'can_retrieve_abis_data',
  'can_update_abis_data', 'can_view_referentials', 'can_manage_devises', 'can_manage_jobs',
  'can_manage_permits', 'can_manage_reject_reasons', 'can_create_penalty', 'can_view_penalty',
  'can_bill_penalty', 'can_cancel_penalty',
];

export const SCOPE_FLAGS = ['is_admin', 'has_global_scope', 'has_entity_scope'];