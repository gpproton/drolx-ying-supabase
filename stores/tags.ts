import { defineStore, skipHydrate } from 'pinia'
import type { Database } from '~/supabase/functions/_shared/database.types';
import type { Tag } from '~/supabase/functions/types';
import type { SortItem } from '~/types/shared';
import { getPagingFilter } from '~/util/shared';

export const useTags = defineStore('tags', () => {
  const supabase = useSupabaseClient<Database>();

  const loading = ref(false);
  const search = ref('');
  const itemsPage = ref(1);
  const itemsPerPage = ref(10);
  const serverItems = ref<any[]>([]);
  const totalItems = ref(0);
  const sortBy = ref<SortItem[]>([]);
  const createDialog = ref(false);
  const deleteDialog = ref(false);
  const createItemValue = reactive({
    name: '',
  });

  const loadItems = async (args: { page: number, itemsPerPage: number, sortBy: SortItem[] }) => {
    loading.value = true
    try {
      const { from, to, ascending, filter } = getPagingFilter(args);
      const { data, count, error } = await supabase.from('tags')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order(filter, { ascending })
        .ilike('name', `%${search.value}%`)

      if (error) throw error;
      totalItems.value = count ?? 0;
      serverItems.value = data;
      loading.value = false;
    } catch (error) {
      console.log(error);
    }
  }

  const refreshData = () => loadItems({ page: itemsPage.value, itemsPerPage: itemsPerPage.value, sortBy: sortBy.value, });

  const createItem = async () => {
    try {
      const { error } = await supabase.from('tags').insert(createItemValue);
      if (error) throw error;
      createDialog.value = false;
      refreshData();
    } catch (error) {
      console.log(error);
    }
  }
  const deleteItem = async (value: Tag) => {
    try {
      if (value.id) {
        const { error, count } = await supabase.from('tags')
          .delete({ count: 'exact' })
          .eq('id', value.id)

        if (error) throw error;
        if(count && count > 0) {
          console.log(`Deleted:: ${count}`);
          refreshData();
        }
        deleteDialog.value = false;
      }
    } catch (error) {
      console.log(error);
    }
  }

  return {
    loading: skipHydrate(loading),
    search: skipHydrate(search),
    itemsPage: skipHydrate(itemsPage),
    itemsPerPage: skipHydrate(itemsPerPage),
    serverItems: skipHydrate(serverItems),
    totalItems: skipHydrate(totalItems),
    sortBy: skipHydrate(sortBy),
    createDialog,
    deleteDialog,
    createItemValue,
    loadItems,
    refreshData,
    createItem,
    deleteItem
  }
})
